from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from sqlalchemy.exc import SQLAlchemyError


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    
    # Configuração CORS melhorada para produção
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         supports_credentials=True)
    
    JWTManager(app)
    
    from api.auth import auth_bp
    from api.documents import documents_bp
    from api.secretary import secretary_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(secretary_bp)
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'message': 'API está funcionando'}), 200
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Rota não encontrada'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'message': 'Erro interno'}), 500
    
    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(error):
        db.session.rollback()
        print(f"Erro no banco de dados: {error}")
        return jsonify({'message': 'Erro ao acessar o banco de dados'}), 500
    
    with app.app_context():
        try:
            db.create_all()
        except SQLAlchemyError as e:
            print(f"Erro ao criar tabelas: {e}")
            raise
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
