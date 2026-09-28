export function createAuthSessionCoordinator() {
  let userId = null;
  let revision = 0;
  let identityInitialized = false;

  return {
    setIdentity(nextUserId) {
      const initial = !identityInitialized;
      identityInitialized = true;
      const changed = userId !== nextUserId;
      if (changed) {
        userId = nextUserId;
        revision += 1;
      }
      return { changed, initial, revision };
    },
    getIdentity() {
      return userId;
    },
    currentRevision() {
      return revision;
    },
    beginRequest() {
      revision += 1;
      return revision;
    },
    invalidate(requestRevision) {
      if (revision === requestRevision) revision += 1;
    },
    isCurrent(requestRevision, expectedUserId) {
      return revision === requestRevision && userId === expectedUserId;
    },
  };
}

export function canAcceptSessionResult(coordinator, requestRevision, authEventChanged, sessionUserId) {
  if (!sessionUserId) return false;
  const currentUserId = coordinator.getIdentity();
  if (coordinator.currentRevision() !== requestRevision && currentUserId !== sessionUserId) {
    return false;
  }
  if (authEventChanged && currentUserId !== sessionUserId) return false;
  return !currentUserId || currentUserId === sessionUserId;
}

export function shouldResolveInitialGuest(transition, currentUser) {
  return transition.initial && !currentUser;
}