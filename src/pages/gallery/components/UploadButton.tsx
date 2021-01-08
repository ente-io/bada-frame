import CollectionSelector from 'pages/gallery/components/CollectionSelector';
import React, { useRef } from 'react';
import { Button } from 'react-bootstrap';

const UploadButton = ({ showModal }) => {
  return (
    <>
      <Button variant='primary' onClick={showModal}>
        Upload New Photos
      </Button>
    </>
  );
};

export default UploadButton;