import { useState } from "react";
import { FaFolder, FaFileAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";

const FileTreeNode = ({ filename, nodes, onSelect, path, isSelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDir = !!nodes;

  const handleFileClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen((prev) => !prev);
    } else {
      onSelect(path);
    }
  };

  return (
    <div className="ml-4">
      <div
        className={`cursor-pointer ${isDir ? "font-semibold" : "text-zinc-200"}
          ${isSelected ? "bg-zinc-600 text-white" : "hover:bg-zinc-600 hover:text-white"}
          rounded p-2 flex items-center justify-between transition-all`}
        onClick={handleFileClick}
        title={isDir ? "Click to expand/collapse" : "Click to open file"}
      >
        <div className="flex items-center">
          {isDir ? (
            <FaFolder className={`mr-2 ${isOpen ? "rotate-90" : ""} transition-all`} />
          ) : (
            <FaFileAlt className="mr-2" />
          )}
          {filename}
        </div>
        {isDir && (
          <div className="ml-2">
            {isOpen ? (
              <FaChevronUp className="text-zinc-400" />
            ) : (
              <FaChevronDown className="text-zinc-400" />
            )}
          </div>
        )}
      </div>
      {isDir && isOpen && (
        <ul className="pl-6 mt-1 transition-all duration-300 ease-in-out">
          {filename !== "node_modules" &&
            Object.keys(nodes).map((child) => (
              <li key={child}>
                <FileTreeNode
                  path={path + "/" + child}
                  filename={child}
                  nodes={nodes[child]}
                  onSelect={onSelect}
                  isSelected={isSelected === path + "/" + child}
                />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

const FileTree = ({ tree, onSelect, selectedFile, rootFolderName }) => {
  return (
    <div className="overflow-auto bg-zinc-800 text-zinc-200 p-2 rounded-lg shadow-lg max-h-[80vh]">
      <FileTreeNode
        filename={rootFolderName || "/"}
        nodes={tree}
        path=""
        onSelect={onSelect}
        isSelected={selectedFile}
      />
    </div>
  );
};

export default FileTree;
