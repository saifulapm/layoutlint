import { useState } from 'react';

interface Plan {
  name: string;
  price: string;
  blurb: string;
}

export default function PricingProps({ plans }: { plans: Plan[] }) {
  const [billing] = useState<'monthly' | 'yearly'>('monthly');
  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-xs font-medium text-gray-500">Billed {billing}</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        {plans.map((plan) => (
          <div key={plan.name} className="flex flex-1 flex-col gap-2 rounded-lg border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">{plan.name}</p>
            <p className="text-3xl font-bold">{plan.price}</p>
            <p className="text-sm text-gray-600">{plan.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
