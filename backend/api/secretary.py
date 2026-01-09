from flask import Blueprint, jsonify, request
from services.document_service import get_csv_history_service
from services.csv_service import process_csv_service
from utils.jwt_utils import require_role

secretary_bp = Blueprint('secretary', __name__, url_prefix='/secretary')


@secretary_bp.route('/csv-history', methods=['GET'])
@require_role('secretario')
def get_csv_history(current_user_id=None, current_user=None):
    result, status = get_csv_history_service()
    return jsonify(result), status


@secretary_bp.route('/upload-csv', methods=['POST'])
@require_role('secretario')
def upload_csv(current_user_id=None, current_user=None):
    if 'file' not in request.files:
        return jsonify({'message': 'Nenhum arquivo enviado', 'errors': []}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': 'Nome do arquivo inválido', 'errors': []}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'message': 'Apenas arquivos CSV são aceitos', 'errors': []}), 400
    
    try:
        file_content = file.read()
    except Exception as e:
        return jsonify({'message': 'Erro ao ler arquivo', 'errors': [str(e)]}), 400
    
    result, status = process_csv_service(file_content, file.filename)
    return jsonify(result), status
