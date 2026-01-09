from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from schemas import *
from services.auth_service import *

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


def validate(schema_class, data):
    try:
        return schema_class(**data), None
    except ValidationError as e:
        return None, ({'message': str(e.errors()[0]['msg'])}, 400)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    schema, error = validate(LoginRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = login_service(schema.email, schema.password)
    return jsonify(result), status


@auth_bp.route('/login-cpf', methods=['POST'])
def login_cpf():
    data = request.get_json()
    schema, error = validate(LoginCpfRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = login_cpf_service(schema.cpf, schema.password)
    return jsonify(result), status


@auth_bp.route('/contact-hint', methods=['POST'])
def contact_hint():
    data = request.get_json()
    schema, error = validate(ContactHintRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = contact_hint_service(schema.cpf)
    return jsonify(result), status


@auth_bp.route('/request-otp', methods=['POST'])
def request_otp():
    data = request.get_json()
    schema, error = validate(RequestOtpRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = request_otp_service(schema.cpf, schema.email)
    return jsonify(result), status


@auth_bp.route('/set-password', methods=['POST'])
def set_password():
    data = request.get_json()
    schema, error = validate(SetPasswordRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = set_password_service(schema.cpf, schema.otp, schema.password)
    return jsonify(result), status


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json()
    schema, error = validate(RefreshTokenRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = refresh_token_service(schema.refreshToken)
    return jsonify(result), status


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    schema, error = validate(RegisterRequest, data)
    if error:
        return jsonify(error[0]), error[1]
    
    result, status = register_service(
        schema.name,
        schema.email,
        schema.cpf,
        schema.role,
        schema.password
    )
    return jsonify(result), status
