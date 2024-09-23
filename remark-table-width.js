import { visit } from 'unist-util-visit';

module.exports = function remarkTableWidth() {
  return (tree) => {
    let tableWidth = '100%';
    let columnWidths = [];
    let need_remnove = 0;

    // 尝试遍历所有节点
    visit(tree, (node, index, parent) => {
      
      // 检查文本节点以找出宽度信息
      if (node.type === 'text' || node.type === 'paragraph') {
        const tableWidthMatch = node.value && node.value.match(/table-width:\s*([\d.]+%?)/i);
        const columnWidthsMatch = node.value && node.value.match(/column-widths:\s*([\d.%\s]+)/i);

        if (tableWidthMatch) {
          tableWidth = tableWidthMatch[1];
          console.warn('Found table width:', tableWidth);
          need_remnove = 1;
        }

        if (columnWidthsMatch) {
          columnWidths = columnWidthsMatch[1].split(/\s+/);
          console.warn('Found column widths:', columnWidths);
          need_remnove = 1;
        }

        if (need_remnove) {
          need_remnove = 0;
          // 移除已处理的节点
          console.warn("remove this node:", node.value);
          parent.children.splice(index, 1);
          return [visit.SKIP, index]; // 跳过这个节点
        }
      }
    });

    // 遍历所有表格节点并应用宽度
    visit(tree, 'table', (node) => {
      if (!node.data) node.data = {};
      if (!node.data.hProperties) node.data.hProperties = {};
      node.data.hProperties.style = `width: ${tableWidth};`;

      if (columnWidths.length > 0) {
        node.children.forEach((child, rowIndex) => {
          if (rowIndex === 0) { // 只对表头应用列宽
            child.children.forEach((cell, cellIndex) => {
              if (columnWidths[cellIndex]) {
                if (!cell.data) cell.data = {};
                if (!cell.data.hProperties) cell.data.hProperties = {};
                cell.data.hProperties.style = `width: ${columnWidths[cellIndex]};`;
              }
            });
          }
        });
      }
    });
  };
};