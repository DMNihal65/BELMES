import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const CreateOrderModal = ({ show, handleClose, handleSave }) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Order</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formOrderName">
            <Form.Label>Order Name</Form.Label>
            <Form.Control type="text" placeholder="Enter order name" />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateOrderModal;
