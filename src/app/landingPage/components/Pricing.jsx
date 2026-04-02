import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'plan-free',
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Perfect for personal chats and small groups.',
    cta: 'Start free',
    href: '/signup-login-screen',
    featured: false,
    features: ['Unlimited messages', '1 GB file sharing', 'Groups up to 50', 'Basic support'],
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: '$8',
    period: '/mo',
    description: 'For power users and fast-growing teams.',
    cta: 'Upgrade to Pro',
    href: '/signup-login-screen',
    featured: true,
    features: ['Everything in Free', '2 GB file sharing', 'Groups up to 500', 'Priority support'],
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Advanced controls, security, and compliance.',
    cta: 'Contact sales',
    href: '/signup-login-screen',
    featured: false,
    features: ['SSO and SCIM', 'Audit logs', 'Dedicated success manager', 'SLA and migration help'],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-800 text-gray-900 tracking-tight mb-4">Simple pricing that scales</h2>
          <p className="text-gray-500 text-lg">Start free and upgrade when your team needs more control.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.featured
                  ? 'bg-white border-sky-300 shadow-lg shadow-sky-100'
                  : 'bg-white border-gray-200'
              }`}
            >
              {plan.featured && (
                <span className="w-fit text-xs font-700 uppercase tracking-wider bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full mb-4">
                  Most popular
                </span>
              )}

              <h3 className="text-xl font-700 text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-800 text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>

              <Link
                href={plan.href}
                className={`w-full text-center rounded-xl py-3 text-sm font-600 transition-colors mb-6 ${
                  plan.featured
                    ? 'bg-sky-500 hover:bg-sky-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="flex flex-col gap-2.5 mt-auto">
                {plan.features.map((feature) => (
                  <div key={`${plan.id}-${feature}`} className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
