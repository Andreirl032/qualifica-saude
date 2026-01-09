from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from schemas import QualifyDocumentRequest, UploadDocumentRequest
from services.document_service import *
from utils.jwt_utils import require_auth, require_role

documents_bp = Blueprint('documents', __name__)


@documents_bp.route('/documents/<doc_id>/qualify', methods=['POST'])
@require_role('profissional', 'secretario')
def qualify_document(doc_id, current_user_id=None, current_user=None):
    data = request.get_json()
    try:
        schema = QualifyDocumentRequest(**data)
    except ValidationError:
        return jsonify({'message': 'Dados inválidos'}), 400
    
    result, status = qualify_document_service(doc_id, schema.status, schema.observacoes)
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
    data = request.get_json()
    try:
        schema = UploadDocumentRequest(**data)
    except ValidationError:
        return jsonify({'message': 'Dados inválidos'}), 400
    
    result, status = upload_document_service(procedure_id, document_id, schema.fileName, current_user_id)
    return jsonify(result), status
