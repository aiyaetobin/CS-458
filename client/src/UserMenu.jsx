import React, { useEffect, useRef, useState } from 'react';

function UserMenu({ user, onSignOut })
{
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  // while the menu is open, close it on a click outside or on Escape
  useEffect(() =>
  {
    if (!isOpen)
    {
      return undefined;
    }

    const handlePointerDown = (event) =>
    {
      if (!menuRef.current.contains(event.target))
      {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) =>
    {
      if (event.key === 'Escape')
      {
        setIsOpen(false);
        toggleRef.current.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () =>
    {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // close the menu when tabbing out of it
  const handleBlur = (event) =>
  {
    if (event.relatedTarget && !menuRef.current.contains(event.relatedTarget))
    {
      setIsOpen(false);
    }
  };

  const handleSignOut = async () =>
  {
    setSignOutError('');
    setIsSigningOut(true);

    try
    {
      await onSignOut(); // on success App unmounts this component
    } catch (error)
    {
      console.error('Error during sign out:', error);
      setSignOutError('Sign-out failed. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="user-menu" ref={menuRef} onBlur={handleBlur}>
      <button
        className="user-menu-toggle"
        type="button"
        ref={toggleRef}
        aria-expanded={isOpen}
        aria-controls="user-menu-dropdown"
        onClick={() => setIsOpen((open) => !open)}
      >
        {user.picture && (
          <img className="topbar-avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
        )}
        <span>{user.name}</span>
        <span className="user-menu-caret" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown" id="user-menu-dropdown">
          <button
            className="user-menu-item"
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
          {signOutError && <p className="user-menu-error" role="alert">{signOutError}</p>}
        </div>
      )}
    </div>
  );
}

export default UserMenu;
