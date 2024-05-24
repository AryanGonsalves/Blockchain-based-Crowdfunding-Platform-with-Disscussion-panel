import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import CustomButton from "./CustomButton";
import { logo, menu, search, thirdweb,sun } from "../assets";
import { navLinks } from "../constants";
import { useStateContext } from "../context";

// creating usable Icon component...
const Icon = ({ styles, name, imgUrl, isActive, disabled, handleClick }) => (
  <div
    className={`px-2 h-[48px] rounded-[10px] ${
      isActive && isActive === name
    } flex justify-center items-center gap-4 ${
      !disabled && "cursor-pointer"
    }  ${styles}`}
    onClick={handleClick}
  >
    {/*  */}
    {!isActive ? (
      <img src={imgUrl} alt="fund_logo" className="w-1/2 h-1/2" />
    ) : (
      <img
        src={imgUrl}
        alt="fund_logo"
        className={`w-1/2 h-1/2 ${isActive !== name && "grayscale"}`}
      />
    )}
    <p className="text-slate-500 whitespace-nowrap">{name}</p>
  </div>
);

const Navbar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState("dashboard");
  const [toggleDrawer, setToggleDrawer] = useState(false);

  const { connect, address } = useStateContext();

  return (
    <div className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6 ">

      {/* Sidebar */}
      <div className="flex justify-between items-center top-5 h-0">
        {/* Icons Parent Container */}
        <div className="flex-1 flex justify-between items-center bg-col-1/40 rounded-[20px] p-1 mt-12">
          {/* Icons child container */}
          <div className="flex justify-center items-center gap-3">
            {navLinks.map((link) => (
              <Icon
                key={link.name}
                {...link}
                isActive={isActive}
                handleClick={() => {
                  if (!link.disabled) {
                    setIsActive(link.name);
                    navigate(link.link);
                  }
                }}
              />
            ))}
            <img src={sun} className="w-6"/>
          </div>

        </div>
      </div>

      {/* Button Container */}
      <div className="sm:flex hidden flex-row justify-end gap-4">
        <CustomButton
          btnType="button"
          title={address ? "Create a campaign" : "Connect"}
          styles={address ? "bg-col-3 text-white " : "bg-col-1/40 text-slate-800 "}
          handleClick={() => {
            if (address) navigate("create-campaign");
            else connect();
          }}
        />

        {/* Profile container */}

        <Link to="/">
          <div className="w-[52px] h-[52px] border-2 border-[#2c2f32] flex justify-center items-center cursor-pointer rounded-full overflow-hidden">
            <img
              src={thirdweb}
              alt="user"
              className="object-cover"
            />
          </div>
        </Link>
      </div>

      {/* Mobile Screen Navigation */}
      <div
        className="sm:hidden flex justify-between items-center relative
      "
      >
        <div className="w-[40px] h-[40px] border-2 border-[#2c2f32] flex justify-center items-center cursor-pointer rounded-full overflow-hidden">
          <img
            src={logo}
            alt="user"
            className="object-cover"
          />
        </div>

        {/* Harmburger menu */}
        <img
          src={menu}
          alt="menu"
          className="w-[34px] h-[34px] object-contain cursor-pointer "
          onClick={() => setToggleDrawer((prev) => !prev)}
        />

        <div
          className={`absolute top-[60px] right-0 left-0 bg-[#1c1c24] z-10 shadow-secondary py-4 ${
            !toggleDrawer ? "-translate-y-[100vh]" : "translate-y-0"
          } transition-all duration-700  `}
        >
          <ul className="mb-4">
            {navLinks.map((link) => (
              <li
                key={link.name}
                className={` gap-6 flex p-4 ${
                  isActive === link.name && "bg-[#3a3a43]"
                } `}
                onClick={() => {
                  setIsActive(link.name);
                  setToggleDrawer(false);
                  navigate(link.link);
                }}
              >
                <img
                  src={link.imgUrl}
                  alt={link.name}
                  className={`w-[24px]
                h-[24px] object-contain ${
                  isActive === link.name ? "grayscale-0" : "grayscale"
                }
                
                  `}
                />

                <p
                  className={`ml-[20px]font-epilogue font-semibold text-[14px] ${
                    isActive === link.name ? "text-[#1dc071]" : "text-[#808191]"
                  }`}
                >
                  {link.name}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex mx-4">
            <CustomButton
              btnType="button"
              title={address ? "Create a campaign" : "Connect"}
              styles={address ? "bg-[#1dc071] " : "bg-[#8c6dfd] "}
              handleClick={() => {
                if (address) navigate("create-campaign");
                else connect();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
