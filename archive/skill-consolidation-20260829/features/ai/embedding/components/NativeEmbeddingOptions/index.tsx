import React from "react";
import { useTranslation } from "react-i18next";

const STYLES = {
  container: "w-full h-10 items-center flex",
  text: "text-sm font-base text-white text-opacity-60",
};

export default function NativeEmbeddingOptions() {
  const { t } = useTranslation();

  return (
    <div className={STYLES.container}>
      <p className={STYLES.text}>
        {t("embedding.provider.description")}
      </p>
    </div>
  );
}
