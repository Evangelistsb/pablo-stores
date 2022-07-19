import React, { useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import "./Form.css";

const PabloForm = ({ createPackage }) => {
  const [name, setName] = useState();
  const [image, setImage] = useState();
  const [description, setDescription] = useState();
  const [cost, setCost] = useState();

  return (
    <>
      <div className="pablo-form">
        <div className="form-name">New Package</div>
        <div className="form-main">
          <Row>
            <Form.Label lg={2}>Package Name</Form.Label>
            <Col>
              <Form.Control
                size="lg"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Col>
          </Row>
          <br />
          <Row>
            <Form.Label lg={2}>Package Description</Form.Label>
            <Col>
              <Form.Control
                size="lg"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Col>
          </Row>
          <br />
          <Row>
            <Form.Label lg={2}>Package URL</Form.Label>
            <Col>
              <Form.Control
                size="lg"
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </Col>
          </Row>
          <br />
          <Row>
            <Form.Label lg={2}>Package Cost</Form.Label>
            <Col>
              <Form.Control
                size="lg"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </Col>
          </Row>
          <div
            className="continue"
            onClick={() => createPackage(name, image, description, cost)}
          >
            Continue
          </div>
        </div>
      </div>
    </>
  );
};

export default PabloForm;
