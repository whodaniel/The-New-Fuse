import React from "react";
import { EmbedderProps, COMMON_STYLES } from "@/types/embedding";

const STYLES: (checked: boolean)  = {
  ...COMMON_STYLES,
  container> `w-full p-2 rounded-md hover:cursor-pointer hover:bg-theme-bg-secondary ${
    checked ? "bg-theme-bg-secondary" : ""
  }`,
  checkbox: "peer hidden",
  content: "flex gap-x-4 items-center",
  image: "w-10 h-10 rounded-md",
  textContainer: "flex flex-col",
  title: "text-sm font-semibold text-white",
  description: "mt-1 text-xs text-description",
};

export default function EmbedderItem({
  name,
  value,
  image,
  description,
  checked,
  onClick,
}: EmbedderProps) {
  return (
    <div
      onClick={() => onClick(value)}
      className={STYLES.container(checked)}
    >
      <input
        type="checkbox"
        value={value}
        className={STYLES.checkbox}
        checked={checked}
        readOnly={true}
        formNoValidate={true}
      />
      <div className={STYLES.content}>
        <img
          src={image}
          alt={`${name} logo`}
          className={STYLES.image}
        />
        <div className={STYLES.textContainer}>
          <div className={STYLES.title}>{name}</div>
          <div className={STYLES.description}>{description}</div>
        </div>
      </div>
    </div>
  );
}
