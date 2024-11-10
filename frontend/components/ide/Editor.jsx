/* eslint-disable react/prop-types */
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { useState } from "react";

function Editor({ code, setCode, selectedFile }) {
  const [language, setLanguage] = useState("javascript");

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <div className="editor-container w-full rounded-lg shadow-xl bg-zinc-900 border border-zinc-600 overflow-hidden relative">
      {/* Internal Language Selection Dropdown inside the editor */}
      <div className="absolute top-2 right-2 z-10">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="bg-zinc-700 text-zinc-200 p-1 rounded-md text-sm shadow-md focus:outline-none hover:bg-zinc-600 transition duration-200"
        >
          <option value="javascript">JS</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="ruby">Ruby</option>
        </select>
      </div>

      {/* Code editor */}
      <AceEditor
        value={code}
        onChange={(e) => selectedFile && setCode(e)}
        height="55vh"  // Keeps the height at 50vh (as per your requirement)
        width="100%"   // Full width to fill container
        mode={language}  // Dynamically change the mode based on selected language
        theme="monokai"
        fontSize="16px"
        highlightActiveLine={true}
        setOptions={{
          enableLiveAutocompletion: true,
          showLineNumbers: true,
          tabSize: 2,
        }}
        editorProps={{ $blockScrolling: true }}
        style={{
          borderRadius: "8px", 
          backgroundColor: "#282828", // Dark background to match the overall theme
          color: "#f8f8f2",  // Light text for contrast
          padding: "10px",  // Add padding around the code editor
          boxSizing: "border-box",  // Ensure padding doesn't affect size
        }}
      />
    </div>
  );
}

export default Editor;
