import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalBody } from "reactstrap";
import { useTranslation } from "react-i18next";

const DeleteModal = ({ show, onDeleteClick, onCloseClick, isLoading = false }: any) => {
  const { t } = useTranslation();
  
  return (
    <Modal isOpen={show} toggle={onCloseClick} centered={true}>
      <ModalBody className="py-3 px-5">
        <div className="mt-2 text-center">
          <i className="ri-delete-bin-line display-5 text-danger"></i>
          <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
            <h4>{t('AreYouSure')}</h4>
            <p className="text-muted mx-4 mb-0">
              {t('AreYouSureRemoveRecord')}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
          <button
            type="button"
            className="btn w-sm btn-light"
            data-bs-dismiss="modal"
            onClick={onCloseClick}
            disabled={isLoading}
          >
            {t('Close')}
          </button>
          <button
            type="button"
            className="btn w-sm btn-danger "
            id="delete-record"
            onClick={onDeleteClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                {t('Deleting') || 'Deleting...'}
              </>
            ) : (
              t('YesDeleteIt')
            )}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
};

DeleteModal.propTypes = {
  onCloseClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  show: PropTypes.any,
};

export default DeleteModal;