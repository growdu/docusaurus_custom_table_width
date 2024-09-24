// plugins/remark-table-width.js
import { visit } from 'unist-util-visit';

module.exports = function remarkTableWidth() {
  return (tree) => {
    // 初始化宽度信息
    let pendingTableWidth = null;
    let pendingColumnWidths = [];

    // 遍历所有节点
    visit(tree, (node, index, parent) => {
      // 检查是否是文本节点或段落节点，以查找宽度信息
      if (node.type === 'code' && node.lang === '{table-width}') {
        const textContent = node.value || node.children?.map(child => child.value).join('');

        if (textContent) {
          // 匹配 table-width 指令
          const tableWidthMatch = textContent.match(/table-width:\s*([\d.]+%?)/i);
          // 匹配 column-widths 指令
          const columnWidthsMatch = textContent.match(/column-widths:\s*([\d.%\s]+)/i);

          if (tableWidthMatch) {
            pendingTableWidth = tableWidthMatch[1];
            console.warn('Found table width:', pendingTableWidth);
          }

          if (columnWidthsMatch) {
            pendingColumnWidths = columnWidthsMatch[1].split(/\s+/);
            console.warn('Found column widths:', pendingColumnWidths);
          }

          // 如果匹配到任何宽度信息，移除该节点
          if (tableWidthMatch || columnWidthsMatch) {
            if (parent && parent.children) {
              parent.children.splice(index, 1);
              return [visit.SKIP, index];
            }
          }
        }
      }

      // 检查是否是表格节点
      if (node.type === 'table') {
        // 如果有待应用的表格宽度，设置表格的宽度
        if (pendingTableWidth) {
          if (!node.data) node.data = {};
          if (!node.data.hProperties) node.data.hProperties = {};
          node.data.hProperties.style = `width: ${pendingTableWidth};`;
          console.warn(`Applied table width: ${pendingTableWidth}`);
          // 重置待应用的表格宽度
          pendingTableWidth = null;
        }

        // 如果有待应用的列宽度，设置表格的列宽
        if (pendingColumnWidths.length > 0) {
          node.children.forEach((row, rowIndex) => {
            if (rowIndex === 0) { // 只对表头应用列宽
              row.children.forEach((cell, cellIndex) => {
                const width = pendingColumnWidths[cellIndex];
                if (width) {
                  if (!cell.data) cell.data = {};
                  if (!cell.data.hProperties) cell.data.hProperties = {};
                  cell.data.hProperties.style = `width: ${width};`;
                  console.warn(`Applied column ${cellIndex + 1} width: ${width}`);
                }
              });
            }
          });
          // 重置待应用的列宽度
          pendingColumnWidths = [];
        }
      }
    });
  };
};
