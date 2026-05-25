import {useCallback} from 'react';
import {resetIdentity, track} from '../../lib/segment.client';

export default function LogoutButton(props) {
  const logout = useCallback(() => {
    // Segment: track sign-out and reset identity before redirect
    track('User Signed Out', {});
    resetIdentity(); // clears userId + anonymousId — new anonymous session starts

    fetch('/account/logout', {method: 'POST'}).then(
      () => (window.location.href = '/'),
    );
  }, []);

  return (
    <button {...props} onClick={logout}>
      Logout
    </button>
  );
}
