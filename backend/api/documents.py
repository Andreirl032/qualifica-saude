from flask import Blueprint, request, jsonify, send_file
from pydantic import ValidationError
from schemas import QualifyDocumentRequest, UploadDocumentRequest
from services.document_service import *
from utils.jwt_utils import require_auth, require_role
import os

documents_bp = Blueprint('documents', __name__)


@documents_bp.route('/documents/<doc_id>', methods=['GET'])
@require_role('profissional', 'secretario')
def get_document_details(doc_id, current_user_id=None, current_user=None):
    result, status = get_document_details_service(doc_id)
    return jsonify(result), status


@documents_bp.route('/documents/<doc_id>/file', methods=['GET'])
def get_document_file(doc_id):
    # Verificar token do query parameter ou header
    token = request.args.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'message': 'Token não fornecido'}), 401
    
    # Validar token e extrair user_id
    from utils.jwt_utils import decode_token
    payload = decode_token(token)
    if not payload:
        return jsonify({'message': 'Token inválido'}), 401
    
    user_id = payload.get('user_id')
    if not user_id:
        return jsonify({'message': 'Token inválido'}), 401
    
    # Verificar se usuário é profissional ou secretário
    from models import User
    user = User.query.filter_by(id=user_id).first()
    if not user or user.role not in ['profissional', 'secretario']:
        return jsonify({'message': 'Acesso negado'}), 403
    
    file_path, error = get_document_file_path_service(doc_id)
    if error:
        return jsonify({'message': error}), 404
    
    if not os.path.exists(file_path):
        return jsonify({'message': 'Arquivo não encontrado no sistema'}), 404
    
    return send_file(file_path, mimetype='application/pdf')


@documents_bp.route('/documents/<doc_id>/qualify', methods=['POST'])
@require_role('profissional', 'secretario')
def qualify_document(doc_id, current_user_id=None, current_user=None):
    data = request.get_json()
    try:
        schema = QualifyDocumentRequest(**data)
    except ValidationError:
        return jsonify({'message': 'Dados inválidos'}), 400
    
    result, status = qualify_document_service(doc_id, schema.status, schema.observacoes, current_user_id)
    return jsonify(result), status


@documents_bp.route('/patient/procedures', methods=['GET'])
@require_role('paciente')
def get_patient_procedures(current_user_id=None, current_user=None):
    result, status = get_patient_procedures_service(current_user_id)
    return jsonify(result), status


@documents_bp.route('/professional/documents', methods=['GET'])
@require_role('profissional', 'secretario')
def get_professional_documents(current_user_id=None, current_user=None):
    result, status = get_professional_documents_service()
    return jsonify(result), status


@documents_bp.route('/patient/procedures/<procedure_id>/documents/<document_id>/upload', methods=['POST'])
@require_role('paciente')
def upload_document(procedure_id, document_id, current_user_id=None, current_user=None):
    if 'file' not in request.files:
        return jsonify({'message': 'Nenhum arquivo foi enviado'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': 'Nenhum arquivo selecionado'}), 400
    
    result, status = upload_document_service(procedure_id, document_id, file, current_user_id)
    return jsonify(result), status
