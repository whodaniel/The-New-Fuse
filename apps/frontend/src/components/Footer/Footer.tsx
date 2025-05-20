import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { isMobile } from "react-device-detect";
import {
  BookOpen,
  DiscordLogo,
  GithubLogo,
  Briefcase,
  Envelope,
  Globe,
  HouseLine,
  Info,
  LinkSimple,
  Icon,
} from "@phosphor-icons/react";
import System from "@/models/system";
import paths from "@/utils/paths";
import SettingsButton from '../SettingsButton.js';

export const MAX_ICONS = 3;

interface IconComponents {
  [key: string]: Icon;
}

export const ICON_COMPONENTS: IconComponents = {
  BookOpen,
  DiscordLogo,
  GithubLogo,
  Envelope,
  LinkSimple,
  HouseLine,
  Globe,
  Briefcase,
  Info,
};

interface FooterIcon {
  icon: keyof typeof ICON_COMPONENTS;
  href: string;
  tooltip: string;
  label: string;
}

export function Footer() {
  const [footerData, setFooterData] = useState<FooterIcon[] | false>(false);

  useEffect(() => {
    async function fetchFooterData() {
      const { footerData } = await System.fetchCustomFooterIcons();
      setFooterData(footerData);
    }
    fetchFooterData();
  }, []);

  // wait for some kind of non-false response from footer data first
  // to prevent pop-in.
  if (footerData === false) return null;

  if (!Array.isArray(footerData) || footerData.length === 0) {
    return (
      <div className="flex justify-center mb-2">
        <div className="flex space-x-4">
          <div className="flex w-fit">
            <Link
              to={paths.github()}
              target="_blank"
              rel="noreferrer"
              className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
              aria-label="Find us on Github"
              data-tooltip-id="footer-item"
              data-tooltip-content="View source code on Github"
            >
              <GithubLogo
                weight="fill"
                className="h-5 w-5"
                color="var(--theme-sidebar-footer-icon-fill)"
              />
            </Link>
          </div>
          <div className="flex w-fit">
            <Link
              to={paths.docs()}
              target="_blank"
              rel="noreferrer"
              className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
              aria-label="Docs"
              data-tooltip-id="footer-item"
              data-tooltip-content="Open AnythingLLM help docs"
            >
              <BookOpen
                weight="fill"
                className="h-5 w-5"
                color="var(--theme-sidebar-footer-icon-fill)"
              />
            </Link>
          </div>
          <div className="flex w-fit">
            <Link
              to={paths.discord()}
              target="_blank"
              rel="noreferrer"
              className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
              aria-label="Join our Discord server"
              data-tooltip-id="footer-item"
              data-tooltip-content="Join the AnythingLLM Discord"
            >
              <DiscordLogo
                weight="fill"
                className="h-5 w-5"
                color="var(--theme-sidebar-footer-icon-fill)"
              />
            </Link>
          </div>
          <div className="flex w-fit">
            <SettingsButton />
          </div>
        </div>
        {!isMobile && <Tooltip id="footer-item" />}
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-2">
      <div className="flex space-x-4">
        {footerData.slice(0, MAX_ICONS).map((item, i) => {
          const IconComponent = ICON_COMPONENTS[item.icon];
          return (
            <div key={i} className="flex w-fit">
              <Link
                to={item.href}
                target="_blank"
                rel="noreferrer"
                className="transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover"
                aria-label={item.label}
                data-tooltip-id="footer-item"
                data-tooltip-content={item.tooltip}
              >
                <IconComponent
                  weight="fill"
                  className="h-5 w-5"
                  color="var(--theme-sidebar-footer-icon-fill)"
                />
              </Link>
            </div>
          );
        })}
        <div className="flex w-fit">
          <SettingsButton />
        </div>
      </div>
      {!isMobile && <Tooltip id="footer-item" />}
    </div>
  );
}
