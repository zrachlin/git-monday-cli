const changeStatusString = (boardId, itemId, statusColumnId, status) => {
  return `mutation {
    change_simple_column_value (board_id: ${boardId}, item_id: ${itemId}, column_id: ${statusColumnId}, value: "${status}") {
    id
    }
    }`;
};

const getItemInfoString = itemId => {
  return `query {
    items (ids: ${itemId}) {
    name
    column_values {
      id
      value

    }
    }
    }`;
};

const getTagNames = () => {
  return `query {
    tags {
      name
      id
    }

}`;
};
module.exports = {
  changeStatusString,
  getItemInfoString,
  getTagNames,
};
