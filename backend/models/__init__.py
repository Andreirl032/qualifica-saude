from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    procedures = db.relationship('Procedure', back_populates='patient', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'cpf': self.cpf,
            'role': self.role
        }


class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), unique=True, nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    access_token = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


class OTP(db.Model):
    __tablename__ = 'otps'

    id = db.Column(db.Integer, primary_key=True)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


class Procedure(db.Model):
    __tablename__ = 'procedures'

    id = db.Column(db.String(50), primary_key=True)
    patient_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    facility = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    patient = db.relationship('User', back_populates='procedures')
    required_documents = db.relationship('Document', back_populates='procedure', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'name': self.name,
            'date': self.date,
            'facility': self.facility,
            'status': self.status,
            'requiredDocuments': [doc.to_dict() for doc in self.required_documents]
        }


class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.String(50), primary_key=True)
    procedure_id = db.Column(db.String(50), db.ForeignKey('procedures.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False, default='pdf')
    last_upload_filename = db.Column(db.String(255), nullable=True)
    last_upload_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    procedure = db.relationship('Procedure', back_populates='required_documents')

    def to_dict(self):
        result = {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'type': self.type
        }
        if self.last_upload_filename:
            result['lastUpload'] = {
                'fileName': self.last_upload_filename,
                'uploadedAt': self.last_upload_at.isoformat() if self.last_upload_at else None
            }
        return result


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


class CSVHistory(db.Model):
    __tablename__ = 'csv_history'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    rows = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'rows': self.rows,
            'status': self.status,
            'timestamp': self.timestamp
        }



