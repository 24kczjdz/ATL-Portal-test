import React from 'react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function QueryForm({ table }) {
    /*
    Generate an insertion form based on table.

        Parameters:
            table (DBTable): { 
                collection (string): uppercase name of the collection,
                ID (string): name of ID column,
                schema (map): {
                    column: default value, including ID column
                }
            }

        Returns:
            QueryForm (Component): a query form for writing data
    */

    const navigate = useNavigate(); // Initialize useNavigate
    const [currentQuery, setCurrentQuery] = useState(table.schema);
    const [queryStatus, setQueryStatus] = useState(false);

    const handleQueryUpdate = async (column, value) => {
        let newQuery = {...currentQuery};
        newQuery[column] = value;
        setCurrentQuery(newQuery);
        setQueryStatus(true);
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="text-center mb-8">
          <p className="text-gray-500 font-medium">
            {table.collection} Collection
          </p>
          <h3 className="text-3xl font-bold text-gray-800 mt-4 font-montserrat">
            Query Form
          </h3>
        </div>

        <div className="space-y-4">
          <table class="table-auto0">
            {Object.entries(currentQuery).map((column, index) => (
              <tr>
                <td 
                  className={`text-left ${
                    (column[0] === table.ID)
                      ? "font-bold"
                      : ""
                  }`}
                >
                  {column[0]}: 
                </td>
                <td>
                  <input
                    type="text"
                    name={column[0]}
                    value={column[1]}
                    onChange={(e) => handleQueryUpdate(column[0], e.target.value)}
                    className="flex-1 rounded-full px-4 py-2 border focus:outline-none focus:border-blue-500 ml-30"
                    placeholder={column[0]}
                  />
                </td>
              </tr>
            ))}
          </table>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={async () => {
              const container = await table.handleRead(currentQuery); 
              if (container) {
                setCurrentQuery(container); 
                setQueryStatus(false);
              }
            }}
            disabled={!queryStatus}
            className={`px-6 py-2 rounded-lg ${
              (currentQuery[table.ID] === "")
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Read by {table.ID}
          </button>
          <button
            onClick={() => setQueryStatus(table.handleDelete(currentQuery))}
            disabled={!queryStatus}
            className={`px-6 py-2 rounded-lg ${
              (currentQuery[table.ID] === "")
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            Delete by {table.ID}
          </button>
          <button
            onClick={() => setQueryStatus(table.handleWrite(currentQuery))}
            disabled={!queryStatus}
            className={`px-6 py-2 rounded-lg ${
              (!queryStatus || currentQuery[table.ID] === "")
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Write All Values
          </button>
        </div>
      </div>
    );
    }

    
export default QueryForm;