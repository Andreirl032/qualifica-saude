from datetime import datetime
from models.database import db


class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.String(50), primary_key=True)
    procedure_id = db.Column(db.String(50), db.ForeignKey('procedures.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False, default='pdf')
    last_upload_filename = db.Column(db.String(255), nullable=True)
    last_upload_at = db.Column(db.DateTime, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    qualified_at = db.Column(db.DateTime, nullable=True)
    qualified_by = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    procedure = db.relationship('Procedure', back_populates='required_documents')

    def to_dict(self):
        result = {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'type': self.type,
            'observacoes': self.observacoes,
            'qualifiedAt': self.qualified_at.isoformat() if self.qualified_at else None
        }
        if self.last_upload_filename:
            result['lastUpload'] = {
                'fileName': self.last_upload_filename,
                'uploadedAt': self.last_upload_at.isoformat() if self.last_upload_at else None
            }
        return result
