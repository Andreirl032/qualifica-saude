import { Outlet, Link } from "react-router-dom";
import medic from "../../public/medic.jpeg"

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-base-200 flex">
      <div
        className="hidden md:flex bg-cover bg-center flex-1"
        style={{ backgroundImage: `url(${medic})` }}
      >
      </div>

      <div className="flex-1">
        {/* <div className="card bg-base-100 shadow-xl">
          <div className="card-body"> */}
            <Outlet />
          {/* </div>
        </div> */}
      </div>
    </div>
  );
}
