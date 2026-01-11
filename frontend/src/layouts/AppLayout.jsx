import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

import { BrButton } from "@govbr-ds/webcomponents-react";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-700 flex py-5 relative">
        <Link
          to="/"
          className="btn btn-ghost text-xl absolute left-1/2 transform -translate-x-1/2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            fill="#000000"
            className="w-8 h-8"
          >
            <path d="M64 112C64 85.5 85.5 64 112 64L160 64C177.7 64 192 78.3 192 96C192 113.7 177.7 128 160 128L128 128L128 256C128 309 171 352 224 352C277 352 320 309 320 256L320 128L288 128C270.3 128 256 113.7 256 96C256 78.3 270.3 64 288 64L336 64C362.5 64 384 85.5 384 112L384 256C384 333.4 329 398 256 412.8L256 432C256 493.9 306.1 544 368 544C429.9 544 480 493.9 480 432L480 346.5C442.7 333.3 416 297.8 416 256C416 203 459 160 512 160C565 160 608 203 608 256C608 297.8 581.3 333.4 544 346.5L544 432C544 529.2 465.2 608 368 608C270.8 608 192 529.2 192 432L192 412.8C119 398 64 333.4 64 256L64 112zM512 288C529.7 288 544 273.7 544 256C544 238.3 529.7 224 512 224C494.3 224 480 238.3 480 256C480 273.7 494.3 288 512 288z" />
          </svg>
          <div>Qualifica Saúde</div>
        </Link>
        <div className="flex items-center gap-3 ml-auto mr-5">
          {user && (
            <span className="px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {user.role}
            </span>)}
          <BrButton emphasis="secondary" onClick={logout}>
            Sair
          </BrButton>
        </div>
      </div>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
