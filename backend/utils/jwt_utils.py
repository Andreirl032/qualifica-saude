from flask import request, jsonify
from functools import wraps
import jwt
import os


def get_jwt_secret():
    return os.getenv('JWT_SECRET_KEY', 'chavesecreta')


def decode_token(token):
    try:
        # Remove o prefixo 'access.' ou 'refresh.' se presente
        if '.' in token and not token.count('.') > 2:
            parts = token.split('.', 1)
            if len(parts) == 2 and parts[0] in ['access', 'refresh']:
                token = parts[1]
        
        # Decodifica o payload base64
        import base64
        decoded = base64.b64decode(token).decode()
        
        # Extrai user_id e timestamp
        if '.' in decoded:
            user_id, timestamp = decoded.split('.', 1)
            return {'user_id': user_id, 'timestamp': timestamp}
        
        return None
    except Exception as e:
        print(f"Erro ao decodificar token: {e}")
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '')
    payload = decode_token(token)
    
    if not payload:
        return None
    
    return payload.get('user_id')


def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_current_user()
        
        if not user_id:
            return jsonify({'message': 'Não autorizado'}), 401

        kwargs['current_user_id'] = user_id
        return f(*args, **kwargs)
    
    return decorated_function


def require_role(*allowed_roles):

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_current_user()
            
            if not user_id:
                return jsonify({'message': 'Não autorizado'}), 401
            
            # Busca o usuário no banco para verificar o role
            from models import User
            user = User.query.filter_by(id=user_id).first()
            
            if not user or user.role not in allowed_roles:
                return jsonify({'message': 'Acesso negado'}), 403
            
            kwargs['current_user_id'] = user_id
            kwargs['current_user'] = user
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
