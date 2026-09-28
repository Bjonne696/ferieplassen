export function createIdentityRequestCoordinator() {
  let identity = null;
  let revision = 0;

  return {
    setIdentity(nextIdentity) {
      if (identity !== nextIdentity) {
        identity = nextIdentity;
        revision += 1;
      }
    },
    begin(expectedIdentity) {
      return { identity: expectedIdentity, revision };
    },
    isCurrent(request) {
      return Boolean(
        request.identity &&
        request.identity === identity &&
        request.revision === revision
      );
    },
    invalidate(expectedIdentity) {
      if (identity === expectedIdentity) {
        identity = null;
        revision += 1;
      }
    },
  };
}