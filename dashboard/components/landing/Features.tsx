import { BarChart3, Clock, Code, Globe } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'See metrics update live on the dashboard. Track performance, errors, and user behavior as it happens.',
    highlight: 'Live monitoring',
  },
  {
    icon: Code,
    title: 'Easy Integration',
    description: 'Just install the NPM package and add a few lines of config. Works with any JS framework.',
    highlight: 'Framework agnostic',
  },
  {
    icon: Clock,
    title: 'Historical Data',
    description: 'Look at historical data to find trends and patterns in how your app gets used.',
    highlight: 'Time-series data',
  },
  {
    icon: Globe,
    title: 'Team Collaboration',
    description: 'Multi-team support with role-based access. Manage projects and team members in one place.',
    highlight: 'Multi-tenant ready',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Monitor Your App
          </h2>
          <p className="text-xl text-gray-600">
            Features to help you see what's going on with your app's performance and user behavior.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`flex flex-col lg:flex-row gap-12 items-center ${
                  isEven ? '' : 'lg:flex-row-reverse'
                }`}>
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{feature.highlight}</span>
                  </div>

                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    {feature.title}
                  </h3>

                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="flex-1">
                  <div className={`relative ${isEven ? 'lg:pl-12' : 'lg:pr-12'}`}>
                    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-12 border-2 border-slate-200 shadow-lg">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                        <Icon className="w-12 h-12 text-white" />
                      </div>

                      <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-200 rounded-lg opacity-50"></div>
                      <div className="absolute -bottom-3 -left-3 w-20 h-20 bg-indigo-200 rounded-lg opacity-50"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
