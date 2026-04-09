// src/components/common/VideoModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import ReactPlayer from 'react-player';

const VideoModal = ({ isOpen, toggle, url, title }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>{title || 'Просмотр видео'}</ModalHeader>
      <ModalBody>
        <ReactPlayer
          url={url}
          controls
          width="100%"
          height="auto"
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
              },
            },
          }}
        />
      </ModalBody>
    </Modal>
  );
};

export default VideoModal;