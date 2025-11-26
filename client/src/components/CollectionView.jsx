import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import DBTable from "../handlers/DatabaseHandler";

function CollectionView({ table }) {
    /*
    Generate an insertion form based on table.

        Parameters:
            table (DBTable): { 
                collection (string): uppercase name of the collection,
                ID (string): name of ID column,
                schema (map): {
                    column: default value, including ID column
                },
                columns (array): list of columns to be shown
            }

        Returns:
            CollectionView (Component): a table for reading data
    */

    const navigate = useNavigate(); // Initialize useNavigate
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await table.handleRead({}, false);
            if (result) {
                setData(Array.isArray(result) ? result : [result]);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (column, value) => {
        setFilters(prev => ({
            ...prev,
            [column]: value.toLowerCase()
        }));
    };

    const clearAllFilters = () => {
        setFilters({});
    };

    const handleRowSelect = (rowId) => {
        setSelectedRows(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(rowId)) {
                newSelection.delete(rowId);
            } else {
                newSelection.add(rowId);
            }
            return newSelection;
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} selected items?`)) {
            return;
        }

        setLoading(true);
        try {
            for (const rowId of selectedRows) {
                await table.handleDelete({ [table.ID]: rowId }, false);
            }
            await loadData();
            setSelectedRows(new Set());
        } catch (err) {
            setError('Failed to delete items');
            console.error('Error deleting items:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(row => {
        // If no filters are applied, show all data
        if (Object.values(filters).every(value => !value)) {
            return true;
        }
        
        // Apply filters only if they have values
        return Object.entries(filters).every(([column, value]) => {
            if (!value) return true;
            const cellValue = String(row[column] || '').toLowerCase();
            return cellValue.includes(value);
        });
    });

    const hasActiveFilters = Object.values(filters).some(value => value);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="text-center mb-8">
                <p className="text-gray-500 font-medium">
                    {table.collection} Collection
                </p>
                <h3 className="text-3xl font-bold text-gray-800 mt-4 font-montserrat">
                    Collection View
                </h3>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Select
                            </th>
                            {Object.keys(table.schema).map(column => (
                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {column}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="px-6 py-3"></th>
                            {Object.keys(table.schema).map(column => (
                                <th key={column} className="px-6 py-3">
                                    <input
                                        type="text"
                                        placeholder={`Filter ${column}`}
                                        value={filters[column] || ''}
                                        className="w-full px-2 py-1 border rounded text-sm"
                                        onChange={(e) => handleFilterChange(column, e.target.value)}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={Object.keys(table.schema).length + 1} className="px-6 py-4 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={Object.keys(table.schema).length + 1} className="px-6 py-4 text-center">
                                    No data found
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row, index) => (
                                <tr key={row[table.ID] || index} className={selectedRows.has(row[table.ID]) ? 'bg-blue-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(row[table.ID])}
                                            onChange={() => handleRowSelect(row[table.ID])}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    {Object.keys(table.schema).map(column => (
                                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row[column]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between mt-8">
                <div className="space-x-4">
                    <button
                        onClick={loadData}
                        className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Refresh Data
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
                <button
                    onClick={handleDeleteSelected}
                    disabled={selectedRows.size === 0}
                    className={`px-6 py-2 rounded-lg ${
                        selectedRows.size === 0
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                >
                    Delete Selected ({selectedRows.size})
                </button>
            </div>
        </div>
    );
}

export default CollectionView;