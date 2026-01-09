import bcrypt
from datetime import datetime
from models import db, User, RefreshToken, OTP
from utils import normalize_cpf, mask_email, generate_otp, make_token, get_otp_expiration, send_otp_email
from sqlalchemy.exc import SQLAlchemyError


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password, hashed):
    if not hashed:
        return False
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_tokens(user):
    try:
        access = make_token('access', user.id)
        refresh = make_token('refresh', user.id)
        
        rt = RefreshToken(token=refresh, user_id=user.id, access_token=access)
        db.session.add(rt)
        db.session.commit()
        
        return {
            'user': user.to_dict(),
            'accessToken': access,
            'refreshToken': refresh
        }
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        raise


def login_service(email, password):
    try:
        user = User.query.filter(User.email.ilike(email)).first()
        
        if not user or not check_password(password, user.password):
            return {'message': 'Credenciais inválidas'}, 401
        
        return create_tokens(user), 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao realizar login'}, 500


def login_cpf_service(cpf, password):
    try:
        cpf_clean = normalize_cpf(cpf)
        user = User.query.filter_by(cpf=cpf_clean).first()
        
        if not user:
            return {'message': 'CPF não encontrado'}, 404
        
        if user.role == 'secretario':
            return {'message': 'CPF não permitido para este fluxo.'}, 403
        
        if not user.password:
            return {'message': 'É necessário definir uma senha antes do primeiro acesso.'}, 409
        
        if not check_password(password, user.password):
            return {'message': 'Credenciais inválidas'}, 401
        
        return create_tokens(user), 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao realizar login'}, 500


def contact_hint_service(cpf):
    try:
        cpf_clean = normalize_cpf(cpf)
        user = User.query.filter_by(cpf=cpf_clean).first()
        
        if not user or user.role == 'secretario':
            return {'message': 'CPF não encontrado para este fluxo'}, 404
        
        return {'ok': True, 'contactHint': mask_email(user.email)}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar informações'}, 500




def request_otp_service(cpf, email=None):
    try:
        cpf_clean = normalize_cpf(cpf)
        user = User.query.filter_by(cpf=cpf_clean).first()
        
        if not user or user.role == 'secretario':
            return {'message': 'CPF não encontrado para este fluxo'}, 404
        
        code = generate_otp()
        
        OTP.query.filter_by(cpf=cpf_clean).delete()
        
        otp = OTP(cpf=cpf_clean, code=code, expires_at=get_otp_expiration())
        db.session.add(otp)
        db.session.commit()
        
        send_otp_email(user.email, code, user.name)
        
        return {
            'ok': True,
            'hasPassword': bool(user.password),
            'expiresInSeconds': 300,
            'otpPreview': code,
            'contactHint': mask_email(email or user.email)
        }, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao solicitar código'}, 500


def set_password_service(cpf, otp_code, password):
    try:
        cpf_clean = normalize_cpf(cpf)
        user = User.query.filter_by(cpf=cpf_clean).first()
        
        if not user or user.role == 'secretario':
            return {'message': 'CPF não encontrado'}, 404
        
        if len(password) < 6:
            return {'message': 'Senha deve ter ao menos 6 caracteres'}, 400
        
        otp = OTP.query.filter_by(cpf=cpf_clean).first()
        
        if not otp:
            return {'message': 'Código expirado ou não solicitado'}, 400
        
        if datetime.now() > otp.expires_at:
            db.session.delete(otp)
            db.session.commit()
            return {'message': 'Código expirado'}, 400
        
        if otp.code != otp_code:
            return {'message': 'Código inválido'}, 400
        
        user.password = hash_password(password)
        db.session.delete(otp)
        db.session.commit()
        
        return {'ok': True}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao definir senha'}, 500


def refresh_token_service(refresh_token):
    try:
        rt = RefreshToken.query.filter_by(token=refresh_token).first()
        
        if not rt:
            return {'message': 'Refresh inválido'}, 401
        
        
        new_access = make_token('access', rt.user_id)
        rt.access_token = new_access
        db.session.commit()
        
        return {'accessToken': new_access}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao renovar token'}, 500


def register_service(name, email, cpf, role, password):
    try:
        if role not in ['paciente', 'profissional', 'secretario']:
            return {'message': 'Papel inválido'}, 400
        
        if email and User.query.filter(User.email.ilike(email)).first():
            return {'message': 'E-mail já cadastrado'}, 409
        
        last = User.query.order_by(User.id.desc()).first()
        next_id = 1
        if last and last.id.startswith('u'):
            try:
                next_id = int(last.id[1:]) + 1
            except:
                next_id = User.query.count() + 1
        
        user = User(
            id=f"u{next_id}",
            name=name,
            email=email or '*****ro@hint.com',
            cpf=normalize_cpf(cpf) if cpf else f"0000000000{next_id}",
            role=role,
            password=hash_password(password) if password else None
        )
        
        db.session.add(user)
        db.session.commit()
        
        return {'ok': True}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao registrar usuário'}, 500
