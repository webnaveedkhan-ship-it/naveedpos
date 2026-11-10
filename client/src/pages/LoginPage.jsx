import React from 'react';
import AuthPortal from './Auth/AuthPortal';

const LoginPage = ({ defaultTab = 'login' }) => {
  return <AuthPortal defaultTab={defaultTab} />;
};

export default LoginPage;
