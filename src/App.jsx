import { useEffect, useState } from "react";
import { List, arrayMove } from "react-movable";
import ReferenceParser from "referenceparser";
import bookToUsfm from "./assets/bookToUsfm.json";
const rp = new ReferenceParser();
import "./App.css";

const API_URL = import.meta.env?.VITE_API_URL ?? "https://sil-bibles-api.parabible.com/"
console.log(API_URL)

const DEFAULT_TRANSLATION_ORDER = [
  "NIV84",
  "NIV11",
  "RSV",
  "NRSV",
  "ESVUS16",
  "NET08",
  "GNTD",
  "CEVUS06",
  "NLT96",
  "NLT04",
  "GW",
  "REB89",
  "NASB",
  "NJPS2017",
  "KJV",
  "EASY",
  "NIrV",
  "T4T",
]
const orderVersesByTranslation = (verses) => 
  verses.slice().sort((a, b) => {
    const aIndex = DEFAULT_TRANSLATION_ORDER.indexOf(a.translation) ?? DEFAULT_TRANSLATION_ORDER.length
    const bIndex = DEFAULT_TRANSLATION_ORDER.indexOf(b.translation) ?? DEFAULT_TRANSLATION_ORDER.length
    return aIndex - bIndex;
  })

const getVerses = async (ref) => {
  const response = await fetch(`${API_URL}?reference=${ref}`);
  const sortedVerses = orderVersesByTranslation(await response.json());
  return sortedVerses;
};

const VerseListItem = ({ text, translation }) => {
  return (
    <>
      <div className="min-w-24 font-bold">{translation}</div>
      <div className="">{text}</div>
    </>
  );
};

const toUsfmRef = (ref) => {
  const { book, chapter, verse } = ref;
  return `${bookToUsfm[book]} ${chapter}:${verse}`;
};

const toFriendlyRef = (ref) => {
  const { book, chapter, verse } = ref;
  if (verse) {
    return `${book} ${chapter}:${verse}`;
  } else if (chapter) {
    return `${book} ${chapter}`;
  } else {
    return book;
  }
};

const SearchButton = ({ onSearch, currentRef }) => {
  const [freeformReference, setFreeformReference] = useState("");
  const ref = rp.parse(freeformReference);
  const usfmRef = toUsfmRef(ref);
  const friendlyReference = toFriendlyRef(ref);

  useEffect(() => {
    if (currentRef !== freeformReference) {
      setFreeformReference(friendlyReference);
    }
  }, [currentRef]);

  return (
    <div className="min-w-96">
      <label
        htmlFor="default-search"
        className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          value={freeformReference}
          onChange={(e) => setFreeformReference(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onSearch(usfmRef);
            }
          }}
          id="default-search"
          className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type a new reference"
          required
        />
        <button
          onClick={() => onSearch(usfmRef)}
          className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
        >
          Search
        </button>
        {currentRef !== usfmRef ? (
          <div className="uppercase font-bold text-gray-400 text-xs w-full text-center absolute bottom-0">
            {friendlyReference}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Button = ({ children, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="mx-1 my-2 text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
  >
    {children}
  </button>
);

const copyAsTable = (verses) => {
  // copy as html table
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  verses.forEach((verse) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = verse.translation;
    const td2 = document.createElement("td");
    td2.textContent = verse.text;
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });
  document.body.appendChild(table);
  const range = document.createRange();
  range.selectNode(table);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
  document.body.removeChild(table);
};

const copyAsUsfm = (verses) => {
  // copy as usfm
  const usfm = verses
    .map((verse) => `\\tr \\tc1 ${verse.translation} \\tc2 ${verse.text}`)
    .join("\n");
  navigator.clipboard.writeText(usfm);
  console.log(usfm);
};

function App() {
  const [reference, setReference] = useState("");
  const [verses, setVerses] = useState([]);

  const updateVerses = async (ref) => {
    try {
      const verses = await getVerses(ref);
      setReference(ref);
      setVerses(verses);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex flex-row justify-center relative mx-auto">
        <SearchButton onSearch={updateVerses} currentRef={reference} />
        <div className="flex flex-row ml-4">
        {/* copy button */}
          <Button onClick={() => copyAsTable(verses)} title={"Copy (Word)"}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </Button>
        {/* copy button */}
          <Button onClick={() => copyAsUsfm(verses)} title="Copy (Paratext)">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-feather"><path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/></svg>
          </Button>
        </div>
      </div>
      <div className="text-left pt-8">
        <List
        lockVertically={true}
          values={verses}
          onChange={({ oldIndex, newIndex }) =>
            setVerses(arrayMove(verses, oldIndex, newIndex))
          }
          renderList={({ children, props }) => 
          <div
           {...props}>{children}</div>
        }
          renderItem={({ value, props }) => (
            <div className="py-1 flex flex-row cursor-pointer hover:bg-blue-50" key={value.translation} {...props}>
              <VerseListItem
                translation={value.translation}
                text={value.text}
              />
            </div>
          )}
        />
      </div>
    </>
  );
}

export default App;
