import React from 'react';
import { Card, PageTemplate } from '../components/ui';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiClock,
  FiExternalLink
} from 'react-icons/fi';

const Contact = () => {
  const contactInfo = [
    {
      icon: FiMapPin,
      title: 'Address',
      content: 'Arts Tech Lab, Run Run Shaw Tower (RRST-4.35)',
      subtitle: 'Centennial Campus, The University of Hong Kong, Pok Fu Lam, Hong Kong',
      color: 'primary'
    },
    {
      icon: FiPhone,
      title: 'Phone',
      content: '(+852) 3917 5801',
      color: 'success'
    },
    {
      icon: FiMail,
      title: 'Email',
      content: 'atlab@hku.hk',
      href: 'mailto:atlab@hku.hk',
      color: 'info'
    },
    {
      icon: FiClock,
      title: 'Office Hours',
      content: '09:30 – 17:30',
      subtitle: 'Monday to Friday',
      color: 'warning'
    }
  ];

  return (
    <PageTemplate
      title="Contact Us"
      description="Get in touch with the Arts Technology Lab team"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {contactInfo.map((info, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <Card.Content className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-${info.color}-100 dark:bg-${info.color}-900/20 flex-shrink-0`}>
                  <info.icon className={`w-6 h-6 text-${info.color}-600 dark:text-${info.color}-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-medium text-lg mb-2 text-gray-900 dark:text-white">
                    {info.title}
                  </h3>
                  {info.href ? (
                    <a 
                      href={info.href}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-literary transition-colors duration-200 flex items-center"
                    >
                      {info.content}
                      <FiExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200 font-literary">
                      {info.content}
                    </p>
                  )}
                  {info.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-literary mt-1">
                      {info.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Visit Us</Card.Title>
          <Card.Description>Find us on the Centennial Campus</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-sm font-literary text-primary-700 dark:text-gray-300 leading-relaxed">
              The Arts Technology Lab is located in Room 4.35 of the Run Run Shaw Tower on the Centennial Campus. 
              We're open during regular business hours and welcome visitors who want to learn more about our 
              facilities and ongoing projects.
            </p>
          </div>
        </Card.Content>
      </Card>
    </PageTemplate>
  );
};

export default Contact;