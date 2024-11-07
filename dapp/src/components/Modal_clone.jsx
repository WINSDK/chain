import React, { useEffect } from 'react';
import './Modal_clone.scss'; 

const Modal = ({ id, isOpen, onClose, children, open }) => {
    // Close modal when clicking outside
    const handleClickOutside = (event) => {
        const dialog = document.getElementById(id);
        if (dialog && event.target === dialog) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            const dialog = document.getElementById(id);
            dialog.showModal();
            window.addEventListener('click', handleClickOutside);
            return () => {
                window.removeEventListener('click', handleClickOutside);
            };
        }
    }, [isOpen, id]);

    // If not open, don't render anything
    if (!isOpen) return null;

    return (
        <div>
            <button onClick={() => document.getElementById(id).showModal()}>
                {open}
            </button>
            <dialog id={id} className="modal">
                <div className="modal-content">
                    {children}
                    <form method="dialog">
                        <button type="submit" onClick={onClose}>Close</button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

export default Modal;