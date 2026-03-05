import { ContactDetails } from '../_components/contact-details';

export const metadata = {
    title: 'View Contact | Admin Panel',
    description: 'View and reply to a contact message',
};

export default async function ContactViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ContactDetails id={parseInt(id)} />;
}
