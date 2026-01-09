from datetime import datetime
from models.database import db


class ProfessionalDocument(db.Model):
    __tablename__ = 'professional_documents'

    id = db.Column(db.String(50), primary_key=True)
    patient_name = db.Column(db.String(255), nullable=False)
    patient_cpf = db.Column(db.String(14), nullable=False)
    procedure_name = db.Column(db.String(255), nullable=False)
    document_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    received_at = db.Column(db.DateTime, nullable=False)
    last_update = db.Column(db.DateTime, nullable=False)
    attachment_filename = db.Column(db.String(255), nullable=True)
    attachment_url = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    pending_reason = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'patientName': self.patient_name,
            'patientCpf': self.patient_cpf,
            'procedureName': self.procedure_name,
            'documentName': self.document_name,
            'status': self.status,
            'receivedAt': self.received_at.isoformat(),
            'lastUpdate': self.last_update.isoformat(),
            'attachments': [{
                'fileName': self.attachment_filename,
                'url': self.attachment_url or '#'
            }] if self.attachment_filename else [],
            'notes': self.notes,
            'pendingReason': self.pending_reason,
            'priority': self.priority
        }
