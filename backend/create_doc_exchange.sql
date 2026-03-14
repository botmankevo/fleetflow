CREATE TABLE IF NOT EXISTS document_exchange (
    id SERIAL NOT NULL,
    carrier_id INTEGER NOT NULL,
    load_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    uploaded_by_user_id INTEGER NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    attachment_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    reviewed_by_user_id INTEGER,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(carrier_id) REFERENCES carriers (id),
    FOREIGN KEY(load_id) REFERENCES loads (id),
    FOREIGN KEY(driver_id) REFERENCES drivers (id),
    FOREIGN KEY(uploaded_by_user_id) REFERENCES users (id),
    FOREIGN KEY(reviewed_by_user_id) REFERENCES users (id)
);
CREATE INDEX IF NOT EXISTS ix_document_exchange_carrier_id ON document_exchange (carrier_id);
CREATE INDEX IF NOT EXISTS ix_document_exchange_load_id ON document_exchange (load_id);
CREATE INDEX IF NOT EXISTS ix_document_exchange_driver_id ON document_exchange (driver_id);
CREATE INDEX IF NOT EXISTS ix_document_exchange_uploaded_by_user_id ON document_exchange (uploaded_by_user_id);
