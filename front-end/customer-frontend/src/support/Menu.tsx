"use client";

import { useState } from "react";

type MenuButtonProps = {
  scrolled: boolean;
  onToggleMenu?: () => void;
};

export const MenuButton = (props: MenuButtonProps): React.JSX.Element => {
  const [open, isOpen] = useState<boolean>(false);
  return (
    <>
      <div
        className="z-50 text-neutral-600 hover:text-neutral-800 cursor-pointer flex items-center justify-center"
        onClick={() => {
          isOpen(!open);
          props.onToggleMenu?.();
        }}
      >
        <button className="relative w-5 h-4 md:w-5 flex flex-col justify-between items-center group">
          <span
            className={`block bg-black w-full h-px  transform transition duration-300 ease-in-out  ${open ? "rotate-45 translate-y-2.5" : ""}`}
          ></span>
          <span
            className={`block bg-black  w-full h-[0.5px]  transform transition duration-300 ease-in-out ${open ? "hidden" : "opacity-100"} `}
          ></span>
          <span
            className={`block  bg-black w-full h-px  transform transition duration-300 ease-in-out  ${open ? "-rotate-45 -translate-y-1.25" : ""}`}
          ></span>
        </button>
        {/* <span className="relative hidden md:block overflow-hidden w-13.25">
          <span
            className={`block text-[15px] transition-transform duration-500 ${
              open ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            Menu
          </span>
        </span> */}
      </div>
    </>
  );
};
