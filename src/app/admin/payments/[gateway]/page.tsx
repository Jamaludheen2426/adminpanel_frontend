import GatewayConfigContent from "../_components/gateway-config-content";
import { GATEWAY_SLUGS } from "../_components/gateway-slugs";

export function generateStaticParams() {
    return GATEWAY_SLUGS.map((g) => ({ gateway: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ gateway: string }> }) {
    const p = await params;
    const name = GATEWAY_SLUGS.find((g) => g.slug === p.gateway)?.name ?? p.gateway;
    return { title: `${name} Configuration` };
}

export default async function GatewayPage({ params }: { params: Promise<{ gateway: string }> }) {
    const p = await params;
    return <GatewayConfigContent slug={p.gateway} />;
}
