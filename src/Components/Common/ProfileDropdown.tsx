import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import avatar1 from "../../assets/images/users/sybau.jpg";
import { useAuth } from "react-oidc-context";

const ProfileDropdown = () => {
    const auth = useAuth();
    const { t } = useTranslation();

    const userName = auth.user?.profile?.email;

    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => setIsProfileDropdown(!isProfileDropdown);

    return (
        <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user">
            <DropdownToggle tag="button" type="button" className="btn">
        <span className="d-flex align-items-center">
          <img className="rounded-circle header-profile-user" src={avatar1} alt="Header Avatar" />
          <span className="text-start ms-xl-2">
            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{userName}</span>
            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">{t('')}</span>
          </span>
        </span>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
                <h6 className="dropdown-header">{t('Welcome')} {userName}!</h6>
                <li>
                    <Link to="/account" className="dropdown-item">
                        <i className="mdi mdi-account-circle-outline me-2" />
                        {t('MyAccount')}
                    </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <DropdownItem
                    onClick={() => {
                        auth.removeUser()
                        auth.signoutRedirect({
                            id_token_hint: auth.user?.id_token,
                            extraQueryParams: {
                                client_id: auth.settings.client_id,
                                logout_uri: auth.settings.redirect_uri,
                                response_type: 'code',
                            },
                        });
                    }}
                    className="text-danger"
                >
                    <i className="mdi mdi-logout me-2" />
                    {t('LogOut')}
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ProfileDropdown;