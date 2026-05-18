export type AuthUser = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export type AppEnv = {
  Variables: {
    user: AuthUser;
  };
};
