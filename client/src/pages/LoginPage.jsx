import React from 'react';
import AuthPortal from './Auth/AuthPortal';

const LoginPage = ({ defaultTab = 'login', isPrivateAdminRoute = false }) => {
  return <AuthPortal defaultTab={defaultTab} isPrivateAdminRoute={isPrivateAdminRoute} />;
};

export default LoginPage;
