import base64
import random
from datetime import datetime, timedelta


def normalize_cpf(cpf):
    if not cpf:
        return ''
    return ''.join(filter(str.isdigit, str(cpf)))


def mask_email(email):
    if not email or '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    
    if len(local) <= 3:
        return f"{local[0] if local else ''}***@{domain}"
    
    return f"{local[0]}*****{local[-3:]}@{domain}"


def generate_otp():
    return str(random.randint(100000, 999999))


def make_token(prefix, user_id):
    payload = f"{user_id}.{int(datetime.now().timestamp() * 1000)}"
    encoded = base64.b64encode(payload.encode()).decode()
    return f"{prefix}.{encoded}"


def get_otp_expiration():
    return datetime.now() + timedelta(minutes=5)


def send_otp_email(email, code, name):
    import smtplib
    from email.message import EmailMessage
    import os
    
    try:
        msg = EmailMessage()
        msg["From"] = f"Qualifica Saude <{os.getenv('MAIL_USERNAME', 'qualificasaudeapp@gmail.com')}>"
        msg["To"] = email
        msg["Subject"] = "Seu codigo de verificacao - Qualifica Saude"
        
        html_content = f'''
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
                <h1>Qualifica Saude</h1>
            </div>
            <div style="background: white; padding: 30px;">
                <h2>Ola, {name}!</h2>
                <p>Voce solicitou um codigo de verificacao.</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                           text-align: center; color: #4CAF50; background: #f0f0f0; 
                           padding: 20px; margin: 20px 0;">
                    {code}
                </div>
                <p><strong>Codigo expira em 5 minutos.</strong></p>
            </div>
        </div>
        '''
        
        msg.set_content(f"Seu codigo de verificacao: {code}\n\nCodigo expira em 5 minutos.")
        msg.add_alternative(html_content, subtype='html')
        
        with smtplib.SMTP(os.getenv('MAIL_SERVER', 'smtp.gmail.com'), 
                         int(os.getenv('MAIL_PORT', '587'))) as server:
            server.starttls()
            server.login(os.getenv('MAIL_USERNAME', 'qualificasaudeapp@gmail.com'),
                        os.getenv('MAIL_PASSWORD', ''))
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False
