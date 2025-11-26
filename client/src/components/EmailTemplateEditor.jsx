import React, { useState, useEffect } from 'react';

const EmailTemplateEditor = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'booking_status',
    recipient_type: 'user',
    subject: '',
    html_content: '',
    variables: [],
    is_active: true
  });
  const [availableVariables] = useState([
    'user_name', 'user_email', 'booking_id', 'equipment_name', 'booking_date', 
    'booking_time', 'duration', 'project_name', 'project_type', 'creator_name',
    'member_count', 'start_date', 'end_date', 'project_description', 'sig_name',
    'sig_abbrev', 'sig_description', 'old_status', 'new_status', 'updated_at',
    'organization_name', 'support_email'
  ]);

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name || '',
        template_type: template.template_type || 'booking_status',
        recipient_type: template.recipient_type || 'user',
        subject: template.subject || '',
        html_content: template.html_content || '',
        variables: template.variables || [],
        is_active: template.is_active ?? true
      });
    }
  }, [template]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('html_content');
    const cursorPos = textarea.selectionStart;
    const textBefore = formData.html_content.substring(0, cursorPos);
    const textAfter = formData.html_content.substring(cursorPos);
    const newContent = textBefore + `{{${variable}}}` + textAfter;
    
    setFormData(prev => ({
      ...prev,
      html_content: newContent
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const previewContent = formData.html_content.replace(
    /\{\{(\w+)\}\}/g,
    (match, variable) => `<span class="bg-yellow-100 px-1 rounded">${variable}</span>`
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {template ? 'Edit Email Template' : 'Create Email Template'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                name="template_name"
                value={formData.template_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type
                </label>
                <select
                  name="template_type"
                  value={formData.template_type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="booking_status">Booking Status</option>
                  <option value="project_status">Project Status</option>
                  <option value="sig_status">SIG Status</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Type
                </label>
                <select
                  name="recipient_type"
                  value={formData.recipient_type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Your booking status has been updated"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  HTML Content
                </label>
                <div className="text-xs text-gray-500">
                  Click variables below to insert
                </div>
              </div>
              <textarea
                id="html_content"
                name="html_content"
                value={formData.html_content}
                onChange={handleInputChange}
                rows={12}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter your HTML email template here..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Variables (Click to Insert)
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableVariables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 text-left"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Active Template
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {template ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Email Preview</h4>
              
              <div className="border border-gray-300 rounded-md">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                  <div className="text-sm">
                    <span className="font-medium">Subject:</span> {formData.subject || 'No subject'}
                  </div>
                </div>
                
                <div className="p-4">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: previewContent || '<p class="text-gray-500 italic">No content</p>' 
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <h5 className="font-medium text-blue-900 mb-2">Template Info</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <div><span className="font-medium">Type:</span> {formData.template_type.replace('_', ' ')}</div>
                <div><span className="font-medium">Recipient:</span> {formData.recipient_type}</div>
                <div><span className="font-medium">Status:</span> {formData.is_active ? 'Active' : 'Inactive'}</div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md">
              <h5 className="font-medium text-yellow-900 mb-2">Tips</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use variables like <code>{`{{user_name}}`}</code> for dynamic content</li>
                <li>• Include proper HTML structure for best email compatibility</li>
                <li>• Test with different email clients</li>
                <li>• Keep the design simple and mobile-friendly</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;