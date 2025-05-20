import React, { useState, useRef, useEffect } from "react";
import { decode as HTMLDecode } from "he";
import truncate from "truncate";
import ModalWrapper from "@/components/ModalWrapper";
import { middleTruncate } from "@/utils/directories";
import {
  FileText,
  Info,
  ArrowSquareOut,
  GithubLogo,
  Link as LinkIcon,
  XCircle,
  YoutubeLogo,
} from "@phosphor-icons/react";
import ConfluenceLogo from "@/media/dataConnectors/confluence.png";
import { toPercentString } from "@/utils/numbers";

interface Source {
  title: string;
  text?: string;
  chunkSource?: string;
  score?: number | null;
}

interface CitationsProps {
  sources?: Source[];
}

interface CombinedSource {
  title: string;
  chunks: Array<{
    text: string;
    chunkSource?: string;
    score?: number | null;
  }>;
  references: number;
}

interface ChunkSourceInfo {
  isUrl: boolean;
  text: string | null;
  href: string | null;
  icon: keyof typeof ICONS;
}

interface IconProps {
  className?: string;
  [key: string]: any;
}

const ICONS = {
  file: FileText,
  link: LinkIcon,
  youtube: YoutubeLogo,
  github: GithubLogo,
  confluence: ({ className, ...props }: IconProps) => (
    <img src={ConfluenceLogo} className={className} alt="Confluence" {...props} />
  ),
} as const;

function combineLikeSources(sources: Source[]): CombinedSource[] {
  const combined: { [key: string]: CombinedSource } = {};
  
  sources.forEach((source) => {
    const { title, text = "", chunkSource = "", score = null } = source;
    
    if (combined[title]) {
      combined[title].chunks.push({ text, chunkSource, score });
      combined[title].references += 1;
    } else {
      combined[title] = {
        title,
        chunks: [{ text, chunkSource, score }],
        references: 1,
      };
    }
  });
  
  return Object.values(combined);
}

function parseChunkSource(source: CombinedSource): ChunkSourceInfo {
  const nullResponse: ChunkSourceInfo = {
    isUrl: false,
    text: null,
    href: null,
    icon: "file",
  };

  if (!source.chunks?.[0]?.chunkSource?.startsWith("link://") &&
      !source.chunks?.[0]?.chunkSource?.startsWith("confluence://") &&
      !source.chunks?.[0]?.chunkSource?.startsWith("github://")) {
    return nullResponse;
  }

  try {
    const chunkSource = source.chunks[0].chunkSource;
    const url = new URL(
      chunkSource.split("link://")[1] ||
      chunkSource.split("confluence://")[1] ||
      chunkSource.split("github://")[1]
    );
    
    let text = url.host + url.pathname;
    let icon: keyof typeof ICONS = "link";

    if (url.host.includes("youtube.com")) {
      text = source.title;
      icon = "youtube";
    }

    if (url.host.includes("github.com")) {
      text = source.title;
      icon = "github";
    }

    if (url.host.includes("atlassian.net")) {
      text = source.title;
      icon = "confluence";
    }

    return {
      isUrl: true,
      href: url.toString(),
      text,
      icon,
    };
  } catch {
    return nullResponse;
  }
}

function Citation({ source, onClick }: { source: CombinedSource; onClick: () => void }): JSX.Element | null {
  const { title } = source;
  if (!title) return null;
  
  const chunkSourceInfo = parseChunkSource(source);
  const truncatedTitle = chunkSourceInfo?.text ?? middleTruncate(title, 25);
  const CitationIcon = ICONS[chunkSourceInfo?.icon ?? "file"];

  return (
    <div
      className="w-fit flex flex-row justify-center items-center cursor-pointer text-sky-400"
      onClick={onClick}
    >
      <CitationIcon className="w-6 h-6" weight="bold" />
      <p className="text-sm font-medium whitespace-nowrap">{truncatedTitle}</p>
    </div>
  );
}

function CitationDetailModal({
  source,
  onClose,
}: {
  source: CombinedSource;
  onClose: () => void;
}): JSX.Element {
  const { references, title, chunks } = source;
  const { isUrl, text: webpageUrl, href: linkTo } = parseChunkSource(source);

  return (
    <ModalWrapper isOpen={true}>
      <div className="w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border overflow-hidden">
        <div className="relative p-6 border-b rounded-t border-theme-modal-border">
          <div className="w-full flex gap-x-2 items-center">
            {isUrl && linkTo ? (
              <a
                href={linkTo}
                target="_blank"
                rel="noreferrer"
                className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap hover:underline hover:text-blue-300 flex items-center gap-x-1"
              >
                <h3 className="flex items-center gap-x-1">
                  {webpageUrl}
                  <ArrowSquareOut />
                </h3>
              </a>
            ) : (
              <h3 className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap">
                {truncate(title, 45)}
              </h3>
            )}
          </div>
          {references > 1 && (
            <p className="text-xs text-gray-400 mt-2">
              Referenced {references} times.
            </p>
          )}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 transition-all duration-300 bg-transparent rounded-lg text-sm p-1 inline-flex items-center hover:bg-theme-modal-border hover:border-theme-modal-border hover:border-opacity-50 border-transparent border"
          >
            <XCircle size={24} weight="bold" className="text-white" />
          </button>
        </div>
        <div
          className="h-full w-full overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="py-7 px-9 space-y-2 flex-col">
            {chunks.map(({ text, score }, idx) => (
              <div key={idx}>
                <div className="pt-6 text-white">
                  <div className="flex flex-col w-full justify-start pb-6 gap-y-1">
                    <p className="text-white whitespace-pre-line">
                      {HTMLDecode(omitChunkHeader(text || ""))}
                    </p>

                    {!!score && (
                      <div className="w-full flex items-center text-xs text-white/60 gap-x-2 cursor-default">
                        <div
                          data-tooltip-id="similarity-score"
                          data-tooltip-content="This is the semantic similarity score of this chunk of text compared to your query calculated by the vector database."
                          className="flex items-center gap-x-1"
                        >
                          <Info size={14} />
                          <p>{toPercentString(score)} match</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {idx !== chunks.length - 1 && (
                  <hr className="border-theme-modal-border" />
                )}
              </div>
            ))}
            <div className="mb-6"></div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

function omitChunkHeader(text: string): string {
  if (!text.startsWith("<document_metadata>")) return text;
  return text.split("</document_metadata>")[1].trim();
}

export default function Citations({ sources = [] }: CitationsProps): JSX.Element | null {
  if (sources.length === 0) return null;
  
  const [open, setOpen] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<CombinedSource | null>(null);
  const combinedSources = combineLikeSources(sources);

  return (
    <div className="flex flex-col mt-4 justify-left">
      <button
        onClick={() => setOpen(!open)}
        className={`border-none text-white/50 light:text-black/50 font-medium italic text-sm text-left ml-14 pt-2 ${
          open ? "pb-2" : ""
        } hover:text-white/75 hover:light:text-black/75 transition-all duration-300`}
      >
        {open ? "Hide Citations" : "Show Citations"}
      </button>
      {open && (
        <div className="flex flex-wrap md:flex-row md:items-center gap-4 overflow-x-scroll mt-1 doc__source ml-14">
          {combinedSources.map((source) => (
            <Citation
              key={source.title}
              source={source}
              onClick={() => setSelectedSource(source)}
            />
          ))}
        </div>
      )}
      {selectedSource && (
        <CitationDetailModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
}