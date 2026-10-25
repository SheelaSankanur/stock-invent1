
import os
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

load_dotenv()

app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=2)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

if not app.config["SECRET_KEY"] or not app.config["JWT_SECRET_KEY"]:
    raise RuntimeError("Set SECRET_KEY and JWT_SECRET_KEY in .env")

if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise RuntimeError("Set DATABASE_URL in .env")

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    }
})

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    calculations = db.relationship(
        "ROICalculation",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan",
    )


class ROICalculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False,
        index=True,
    )

    hours = db.Column(db.Numeric(12, 2), nullable=False)
    hourly_rate = db.Column(db.Numeric(12, 2), nullable=False)
    investment = db.Column(db.Numeric(14, 2), nullable=False)
    improvement = db.Column(db.Numeric(5, 2), nullable=False)
    annual_savings = db.Column(db.Numeric(14, 2), nullable=False)
    roi = db.Column(db.Numeric(12, 2), nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=func.now(),
    )


def error(message, status=400):
    return jsonify({"error": message}), status


def parse_number(data, field, minimum=0, maximum=None):
    try:
        value = Decimal(str(data[field]))
    except (KeyError, InvalidOperation, ValueError, TypeError):
        raise ValueError(f"{field} must be a valid number")

    if not value.is_finite() or value < minimum:
        raise ValueError(f"{field} must be at least {minimum}")

    if maximum is not None and value > maximum:
        raise ValueError(f"{field} must not exceed {maximum}")

    return value


def money(value):
    return float(value.quantize(Decimal("0.01")))


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Product Tour API is running"})


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if len(email) > 255 or "@" not in email:
        return error("Enter a valid email address.")

    if not isinstance(password, str) or len(password) < 8:
        return error("Password must contain at least 8 characters.")

    if len(password) > 72:
        return error("Password must be at most 72 characters.")

    user = User(
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
    )

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error("An account with this email already exists.", 409)

    return jsonify({
        "message": "Registration successful. Please log in.",
        "email": user.email,
    }), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    user = db.session.execute(
        db.select(User).filter_by(email=email)
    ).scalar_one_or_none()

    if (
        user is None
        or not isinstance(password, str)
        or not bcrypt.check_password_hash(user.password_hash, password)
    ):
        return error("Invalid email or password.", 401)

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": token,
        "email": user.email,
    })


@app.post("/api/roi")
@jwt_required()
def save_roi():
    data = request.get_json(silent=True) or {}

    try:
        hours = parse_number(data, "hours")
        hourly_rate = parse_number(data, "hourly_rate")
        investment = parse_number(data, "investment")
        improvement = parse_number(data, "improvement", maximum=100)
    except ValueError as exc:
        return error(str(exc))

    # Assumption: hours is the baseline number of hours per month.
    # The improvement percentage estimates the fraction saved.
    annual_savings = hours * 12 * hourly_rate * improvement / 100

    roi = None
    if investment > 0:
        roi = (annual_savings - investment) / investment * 100

    calculation = ROICalculation(
        user_id=int(get_jwt_identity()),
        hours=hours,
        hourly_rate=hourly_rate,
        investment=investment,
        improvement=improvement,
        annual_savings=annual_savings,
        roi=roi,
    )

    db.session.add(calculation)
    db.session.commit()

    return jsonify({
        "message": "Calculation saved.",
        "calculation": {
            "id": calculation.id,
            "annual_savings": money(annual_savings),
            "roi": money(roi) if roi is not None else None,
        },
    }), 201


@app.get("/api/roi")
@jwt_required()
def list_roi():
    user_id = int(get_jwt_identity())

    calculations = db.session.execute(
        db.select(ROICalculation)
        .filter_by(user_id=user_id)
        .order_by(ROICalculation.created_at.desc())
    ).scalars().all()

    return jsonify({
        "calculations": [
            {
                "id": item.id,
                "hours": float(item.hours),
                "hourly_rate": float(item.hourly_rate),
                "investment": float(item.investment),
                "improvement": float(item.improvement),
                "annual_savings": float(item.annual_savings),
                "roi": float(item.roi) if item.roi is not None else 0,
                "created_at": item.created_at.isoformat(),
            }
            for item in calculations
        ]
    })


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True, port=5000)

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Set DATABASE_URL in .env")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
