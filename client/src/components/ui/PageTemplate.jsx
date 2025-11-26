import React from 'react';
import { FiSearch, FiFolder } from 'react-icons/fi';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import Alert from './Alert';
import Input from './Input';

/**
 * Standard Page Template Component
 * 
 * This template provides a consistent layout and styling pattern
 * for all pages in the ATL application.
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {React.ReactNode} props.headerActions - Action buttons for the header
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {function} props.onErrorClose - Error close handler
 * @param {string} props.className - Additional CSS classes
 */
const PageTemplate = ({
  title,
  description,
  headerActions,
  children,
  loading = false,
  error = null,
  onErrorClose,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-4xl font-elegant text-primary-900 dark:text-white mb-2">
                {title}
              </h1>
              {description && (
                <p className="font-literary text-primary-600 dark:text-gray-300 text-lg">
                  {description}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex flex-col sm:flex-row gap-3">
                {headerActions}
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" onClose={onErrorClose}>
              {error}
            </Alert>
          </div>
        )}

        {/* Page Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Standard List View Component
 * 
 * Provides a consistent layout for list-based pages
 */
const ListView = ({ 
  items = [], 
  renderItem, 
  emptyState, 
  searchValue = '',
  onSearchChange,
  filters,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      {(onSearchChange || filters) && (
        <Card>
          <Card.Content className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {onSearchChange && (
                <div className="flex-1">
                  <Input
                    placeholder="Search..."
                    value={searchValue}
                    onChange={onSearchChange}
                    icon={FiSearch}
                  />
                </div>
              )}
              {filters && (
                <div className="flex gap-3">
                  {filters}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Items Grid/List */}
      {items.length === 0 ? (
        <Card>
          <Card.Content className="p-12 text-center">
            {emptyState || (
              <div>
                <div className="text-primary-300 dark:text-gray-600 mb-4">
                  <FiFolder className="w-12 h-12 mx-auto" />
                </div>
                <p className="font-literary text-primary-500 dark:text-gray-400">
                  No items found
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
};

/**
 * Standard Detail View Component
 * 
 * Provides a consistent layout for detail/view pages
 */
const DetailView = ({ 
  title,
  subtitle,
  badges = [],
  actions,
  children,
  sidebar,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 ${className}`}>
      {/* Main Content */}
      <div className="lg:col-span-3">
        <Card>
          <Card.Header>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <Card.Title className="text-2xl">{title}</Card.Title>
                {subtitle && (
                  <Card.Description className="text-lg mt-2">
                    {subtitle}
                  </Card.Description>
                )}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {badges.map((badge, index) => (
                      <Badge key={index} variant={badge.variant || 'primary'} size={badge.size || 'sm'}>
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {actions && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {actions}
                </div>
              )}
            </div>
          </Card.Header>
          <Card.Content>
            {children}
          </Card.Content>
        </Card>
      </div>

      {/* Sidebar */}
      {sidebar && (
        <div className="lg:col-span-1">
          {sidebar}
        </div>
      )}
    </div>
  );
};

/**
 * Standard Form Component
 * 
 * Provides a consistent layout for forms
 */
const FormView = ({ 
  title,
  description,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  children,
  className = ''
}) => {
  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        {description && (
          <Card.Description>{description}</Card.Description>
        )}
      </Card.Header>
      <Card.Content>
        <form onSubmit={onSubmit} className="space-y-6">
          {children}
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-6 border-t border-primary-200 dark:border-gray-700">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

// Export components
PageTemplate.ListView = ListView;
PageTemplate.DetailView = DetailView;
PageTemplate.FormView = FormView;

export default PageTemplate;