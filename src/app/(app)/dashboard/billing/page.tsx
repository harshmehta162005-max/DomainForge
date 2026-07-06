'use client';

import React, { useState } from 'react';
import { PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BorderTrail } from '@/components/ui/border-trail';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("You must be logged in to upgrade.");
      setLoading(false);
      return;
    }

    // Upsert plan in user_settings table
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, plan: 'pro' }, { onConflict: 'user_id' });

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg("Failed to upgrade. Please try again.");
    } else {
      setShowSuccess(true);
    }
  };

	return (
		<section className="relative min-h-screen overflow-hidden py-24">
			<div id="pricing" className="mx-auto w-full max-w-6xl space-y-5 px-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
					viewport={{ once: true }}
					className="mx-auto max-w-xl space-y-5"
				>
					<div className="flex justify-center">
						<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-1 font-mono text-zinc-300">Pricing</div>
					</div>
					<h2 className="mt-5 text-center text-2xl font-bold tracking-tighter text-zinc-100 md:text-3xl lg:text-4xl">
						Upgrade to DomainForge Pro
					</h2>
					<p className="text-zinc-400 mt-5 text-center text-sm md:text-base">
						Unlock automated background availability checking, export capabilities, and generate up to 20 premium domains per batch.
					</p>
				</motion.div>

				<div className="relative">
					<div
						className={cn(
							'z--10 pointer-events-none absolute inset-0 size-full',
							'bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]',
							'bg-[size:32px_32px]',
							'[mask-image:radial-gradient(ellipse_at_center,var(--background)_10%,transparent)]',
						)}
					/>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						viewport={{ once: true }}
						className="mx-auto w-full max-w-2xl space-y-2 mt-8"
					>	
						<div className="grid md:grid-cols-2 bg-zinc-950/50 relative border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
							<PlusIcon className="absolute -top-3 -left-3 size-6 text-zinc-700" />
							<PlusIcon className="absolute -top-3 -right-3 size-6 text-zinc-700" />
							<PlusIcon className="absolute -bottom-3 -left-3 size-6 text-zinc-700" />
							<PlusIcon className="absolute -right-3 -bottom-3 size-6 text-zinc-700" />

							<div className="w-full px-4 pt-5 pb-4">
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<h3 className="leading-none font-semibold text-zinc-200">Monthly</h3>
										<div className="flex items-center gap-x-2">
											<span className="text-zinc-500 text-sm line-through">$8.99</span>
											<Badge variant="secondary" className="bg-zinc-800 text-zinc-300">11% off</Badge>
										</div>
									</div>
									<p className="text-zinc-400 text-sm">Perfect for occasional domain hunters.</p>
								</div>
								<div className="mt-10 space-y-4">
									<div className="text-zinc-400 flex items-end gap-0.5 text-xl">
										<span>$</span>
										<span className="text-zinc-100 -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
											7.99
										</span>
										<span>/month</span>
									</div>
									<Button 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100" 
                    variant="outline" 
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
										{loading ? "Processing..." : "Start Your Journey"}
									</Button>
								</div>
							</div>
							
              <div className="relative w-full rounded-lg border border-zinc-700/50 bg-zinc-900/40 px-4 pt-5 pb-4 overflow-hidden">
								<BorderTrail
									style={{
										boxShadow:
											'0px 0px 60px 30px rgba(34,211,238,0.3), 0 0 100px 60px rgba(34,211,238,0.2), 0 0 140px 90px rgba(34,211,238,0.1)',
									}}
									size={100}
								/>
								<div className="space-y-1 relative z-10">
									<div className="flex items-center justify-between">
										<h3 className="leading-none font-semibold text-cyan-400">Yearly</h3>
										<div className="flex items-center gap-x-2">
											<span className="text-zinc-500 text-sm line-through">$8.99</span>
											<Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">22% off</Badge>
										</div>
									</div>
									<p className="text-zinc-400 text-sm">Save big and secure your domain portfolio year-round!</p>
								</div>
								<div className="mt-10 space-y-4 relative z-10">
									<div className="text-zinc-400 flex items-end text-xl">
										<span>$</span>
										<span className="text-zinc-100 -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
											6.99
										</span>
										<span>/month</span>
									</div>
									<Button 
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
										{loading ? "Processing..." : "Get Started Now"}
									</Button>
								</div>
							</div>
						</div>

						<div className="text-zinc-500 flex items-center justify-center gap-x-2 text-sm mt-8">
							<ShieldCheckIcon className="size-4" />
							<span>Access to all features with no hidden fees</span>
						</div>
					</motion.div>
				</div>
			</div>

      {/* Success Dialog */}
      <Dialog 
        open={showSuccess} 
        onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open) {
            router.push("/dashboard/settings");
            router.refresh();
          }
        }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl text-cyan-400">Welcome to Pro! 🎉</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              Your account has been successfully upgraded to DomainForge Pro. You now have access to automated watchlist checking, data exports, and expanded AI domain generation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false} className="border-t border-zinc-800 bg-zinc-900/50">
            <DialogClose render={<Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium" />}>
              Go to Settings
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!errorMsg} onOpenChange={(open) => { if (!open) setErrorMsg("") }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-red-400">Upgrade Error</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              {errorMsg}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={true} className="border-t border-zinc-800 bg-zinc-900/50" />
        </DialogContent>
      </Dialog>
		</section>
	);
}
